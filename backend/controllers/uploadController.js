const db = require('../db/knex')

exports.uploadcontroller = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        const { period_id, evaluatee_id, indicator_id, evidence_type_id } = req.body;
        const id = await db('attachments').insert({
            period_id: Number(period_id),
            evaluatee_id: evaluatee_id,
            indicator_id: Number(indicator_id),
            evidence_type_id: Number(evidence_type_id),
            file_name: req.file.originalname,
            mime_type: req.file.mimetype,
            size_bytes: req.file.size,
            storage_path: req.file.path
        });
        res.send({
            message: "Flie uploaded successfilly.",
            fileInfo: req.file
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}