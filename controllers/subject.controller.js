const { where, Op } = require("sequelize");
const Subject = require("../models/subject.model");
const { successResponse, errorResponse, warningResponse } = require("../helpers/response.helper");

// create new subject one by one
const createSubject = async (req, res) => {
  try {
    const { subject_name } = req.body;
    const newSubject = await Subject.create({ subject_name });

    successResponse(res, "Subject created successfully", newSubject, 201);
  } catch (err) {
    errorResponse(res, "Error create subject", err.message);
  }
};

// import subject from excel file
const importSubjectByFile = async (req, res) => {
  try {
    const data = req.excelData;

    const created = await Subject.bulkCreate(data, { validate: true });
    successResponse(res, "Uploads successfully", created);
  } catch (err) {
    errorResponse(res, "Error create subject by file", err.message);
  }
};

// get all subject as json data
const getAllSubject = async (req, res) => {
  try {
    const { search } = req.query;
    let pipeline = {attributes: ["subject_id", "subject_name"]};
    if (search) {
      pipeline.where = {
        subject_name: {
          [Op.like]: `%${search}%`,
        },
      };
    }


    const data = await Subject.findAll(pipeline);
    if (data.length <= 0) {
      return warningResponse(res, "Subject not found", 404, []);
    }
    successResponse(res, "Fetch subject successfully", data);
  } catch (err) {
    errorResponse(res, "Error get all subject", err.message);
  }
};

// update subject info
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_name } = req.body;
    const subject = await Subject.update(
      { subject_name },
      {
        where: { subject_id: id },
        validate: true,
      },
    );
    if (subject.length <= 0) {
      return warningResponse(res, "Subject not found", 404);
    }
    successResponse(res, "Update subject successfully", subject);
  } catch (err) {
    errorResponse(res, "Error update subject", err.message);
  }
};

// delete subject by id
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Subject.destroy({ where: { subject_id: id } });
    if (!deleted) {
      return warningResponse(res, "Subject not found", 404);
    }
    successResponse(res, "Delete subject successfully", deleted);
  } catch (err) {
    errorResponse(res, "Error delete subject", err.message);
  }
};

module.exports = {
  createSubject,
  importSubjectByFile,
  getAllSubject,
  updateSubject,
  deleteSubject,
};
