import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { defaultConfig } from '../config/config.js';

export class DataService {
  static cachedMembers = null;
  static cachedSchema = null;
  static activeFilePath = defaultConfig.datasetPath;

  static setDatasetFilePath(filePath) {
    this.activeFilePath = filePath;
    this.cachedMembers = null;
    this.cachedSchema = null;
  }

  static findAnyCsvInDirs() {
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      const csvFile = files.find(f => f.toLowerCase().endsWith('.csv'));
      if (csvFile) {
        return path.join(dataDir, csvFile);
      }
    }
    return null;
  }

  static loadDataset() {
    if (this.cachedMembers && this.cachedSchema) {
      return { members: this.cachedMembers, schema: this.cachedSchema };
    }

    let filePath = this.activeFilePath;
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(defaultConfig.fallbackDatasetPath)) {
        filePath = defaultConfig.fallbackDatasetPath;
      } else {
        const discoveredCsv = this.findAnyCsvInDirs();
        if (discoveredCsv) {
          filePath = discoveredCsv;
        } else {
          throw new Error(`No CSV dataset file found in data/ or backend/data/. Please upload a CSV dataset.`);
        }
      }
    }

    const fileName = path.basename(filePath);

    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Check if the first line is a title or metadata row with fewer columns than the real header line
    const nonColLines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (nonColLines.length > 1) {
      const firstCols = nonColLines[0].split(',').filter(c => c.trim().length > 0);
      const secondCols = nonColLines[1].split(',').filter(c => c.trim().length > 0);
      if (firstCols.length <= 1 && secondCols.length > 2) {
        fileContent = nonColLines.slice(1).join('\n');
      }
    }

    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parseResult.errors && parseResult.errors.length > 0 && parseResult.data.length === 0) {
      throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
    }

    const rawRows = parseResult.data;
    if (!rawRows || rawRows.length === 0) {
      throw new Error('CSV dataset is empty.');
    }

    const columns = Object.keys(rawRows[0]);

    // Detect Target Column (Churn / churn / Disenrolled / Status)
    let targetColumn = columns.find(c => 
      ['churn', 'disenrolled', 'target', 'is_churn', 'left_plan'].includes(c.toLowerCase())
    ) || 'Churn';

    if (!columns.includes(targetColumn)) {
      // Fallback: look for column containing 'churn'
      const found = columns.find(c => c.toLowerCase().includes('churn'));
      if (found) targetColumn = found;
      else targetColumn = columns[columns.length - 1]; // last column default
    }

    // Detect Member ID Column
    let idColumn = columns.find(c =>
      ['member_id', 'memberid', 'id', 'user_id', 'subscriber_id'].includes(c.toLowerCase())
    ) || 'Member_ID';

    if (!columns.includes(idColumn)) {
      const found = columns.find(c => c.toLowerCase().includes('id'));
      if (found) idColumn = found;
      else idColumn = columns[0];
    }

    const numericalFeatures = [];
    const categoricalFeatures = [];

    columns.forEach(col => {
      if (col === idColumn || col === targetColumn) return;

      // Sample non-null values to infer type
      let numCount = 0;
      let sampleCount = 0;

      for (let i = 0; i < Math.min(rawRows.length, 100); i++) {
        const val = rawRows[i][col];
        if (val !== null && val !== undefined && val !== '') {
          sampleCount++;
          if (typeof val === 'number' || !isNaN(Number(val))) {
            numCount++;
          }
        }
      }

      if (sampleCount > 0 && numCount / sampleCount >= 0.8) {
        numericalFeatures.push(col);
      } else {
        categoricalFeatures.push(col);
      }
    });

    // Clean & normalize rows
    const members = rawRows.map((row, idx) => {
      const cleanedRow = { ...row };
      
      if (!cleanedRow[idColumn]) {
        cleanedRow[idColumn] = `MMB-${10000 + idx + 1}`;
      }

      // Standardize target churn representation
      let targetVal = String(cleanedRow[targetColumn] || '').trim().toLowerCase();
      if (['yes', '1', 'true', 'churn', 'y'].includes(targetVal)) {
        cleanedRow[targetColumn] = 'Yes';
      } else {
        cleanedRow[targetColumn] = 'No';
      }

      // Convert numerical features
      numericalFeatures.forEach(col => {
        if (cleanedRow[col] === null || cleanedRow[col] === undefined || cleanedRow[col] === '') {
          cleanedRow[col] = 0; // Will be imputed in Preprocessing
        } else {
          cleanedRow[col] = Number(cleanedRow[col]);
        }
      });

      return cleanedRow;
    });

    const schema = {
      targetColumn,
      idColumn,
      numericalFeatures,
      categoricalFeatures,
      totalRows: members.length,
      columns,
      fileName,
      filePath,
    };

    this.cachedMembers = members;
    this.cachedSchema = schema;

    return { members, schema };
  }

  static getMemberById(memberId) {
    const { members, schema } = this.loadDataset();
    return members.find(m => String(m[schema.idColumn]).toLowerCase() === String(memberId).toLowerCase());
  }

  static reloadDataset() {
    this.cachedMembers = null;
    this.cachedSchema = null;
    return this.loadDataset();
  }
}
