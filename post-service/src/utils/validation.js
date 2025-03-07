// validation.js
const joi = require('joi');

const validPostCreation = async (data) => {
    const schema = joi.object({
        content: joi.string().min(3).max(3000).required(),
    });
    return schema.validate(data); // No need for `await` here
};

module.exports = { validPostCreation };