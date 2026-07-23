const mongoose = require("mongoose");
const Backup = require("../models/Backup");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const archiver = require("archiver");
const { logger } = require("./logger");

const ensureBackupDir = () => {
  const backupDir = path.join(__dirname, "../../backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

const runApplicationBackup = async (adminId) => {
  const startTime = Date.now();
  const backupId = `backup-${Date.now()}`;
  const backupDir = ensureBackupDir();
  const zipPath = path.join(backupDir, `${backupId}.zip`);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", async () => {
      try {
        const sizeBytes = archive.pointer();
        const durationMs = Date.now() - startTime;

        // Generate SHA-256 for the ZIP
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(zipPath);
        stream.on('data', data => hash.update(data));
        stream.on('end', async () => {
          const checksum = hash.digest('hex');

          // Save backup record
          const backupRecord = await Backup.create({
            backupId,
            createdBy: adminId,
            sizeBytes,
            durationMs,
            status: "completed",
            filePath: zipPath,
            checksum,
            type: "application", // renamed to Application Backup
            completedAt: new Date(),
          });

          resolve(backupRecord);
        });
      } catch (err) {
        reject(err);
      }
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Stream collections to zip
    const processCollections = async () => {
      try {
        const collections = await mongoose.connection.db.collections();
        const metadata = {
          backupId,
          timestamp: new Date().toISOString(),
          collections: [],
        };

        for (const collection of collections) {
          const collName = collection.collectionName;
          metadata.collections.push(collName);
          
          // Use cursor to stream docs to avoid OOM
          const cursor = collection.find();
          let items = [];
          
          while (await cursor.hasNext()) {
            const doc = await cursor.next();
            items.push(doc);
          }
          
          if (items.length > 0) {
            archive.append(JSON.stringify(items, null, 2), { name: `${collName}.json` });
          }
        }

        archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });
        archive.finalize();
      } catch (err) {
        archive.abort();
        reject(err);
      }
    };

    processCollections();
  });
};

module.exports = {
  runApplicationBackup,
};
