const { Op } = require('sequelize');
const { warningResponse, successResponse, errorResponse } = require('../helpers/response.helper');
const Class = require('../models/class.model');
const Student = require('../models/student.model');

// get all class class as json data
const getAllClass = async (req, res) => {
    try{
        const { search } = req.query;
        const whereClause = search ? { class_name: { [Op.like]: `%${search}%` } } : {};

        const {count, rows} = await Class.findAndCountAll({where: whereClause,attributes: ["class_id", "class_name"]});
        if(rows.length <= 0) {
            return warningResponse(res, "Class not found", 404, []);
        }
        const classes = rows.map(r => r.toJSON());

        successResponse(res, "Get all class successfully", classes);
    } catch(err) {
        errorResponse(res, "Error get all class", err.message);
    }
}

const getClassReport = async (req, res) => {
    try {
        const {count, rows} = await Class.findAndCountAll({attributes: ["class_id", "class_name"]});
        if(rows.length <= 0) {
            return warningResponse(res, "Class not found", 404, []);
        }
        // const count
        const totalAssigneed = await Class.count({where: {class_name: {[Op.ne]: 'unsign'}}});
        const classes = rows.map(r => r.toJSON())

        successResponse(res, "Get all class successfully", {
            totalClass: count,
            totalAssigneed,
            totalUnsign: count - totalAssigneed
        });
    } catch(err) {
        errorResponse(res, "Error get class report", err.message);
    }
}

// create new class one by one
const createClass = async (req, res) => {
    try{
        const newClass = await Class.create(req.body);
        successResponse(res, "Create class successfully", newClass);
    } catch(err) {
        errorResponse(res, "Error create class", err.message);
    }
}

// create many class by excel file
const createClassByFile = async (req, res) => {
    try {
        const data = req.excelData;
        console.log(data);
        const created = await Class.bulkCreate(data, {validate: true});
        successResponse(res, "Create class by file successfully", created);
    } catch(err) {
        errorResponse(res, "Error create class by file", err.message);
    }
}

// update class info
const updateClass = async (req, res) => {
    try{
        const { id } = req.params;
        const { class_name } = req.body;

        const classes = await Class.findByPk(id);
        if(!classes) {
            return warningResponse(res, "Class not found!!", 404);
        } 
        if(!class_name) return warningResponse(res, "Class name is required!!", 400);
        classes.class_name = class_name;
        await classes.save();
        successResponse(res, "Class update successfully!!", classes);
    }catch(err) {
        errorResponse(res, "Error update class :"+err.message);
    }
}

// delete class by id
const deleteClass = async (req, res) => {
    try{
        const { id } = req.params;
        const classes = await Class.findByPk(id);
        if(!classes) return warningResponse(res, "Class not found!!", 404);

        const students = await Student.findAll({where: {class_id: id}});
        if(students.length > 0) {
            return warningResponse(res, "Cannot delete class with assigned students!!", 400);
        }

        await classes.destroy({validate: true});
        successResponse(res, "Class delete successfully!!");
    } catch(err) {
        res.status(400).json({message: "Error delete class :"+err.message});
    }
}

module.exports = {getAllClass, createClass, updateClass, deleteClass, createClassByFile};
