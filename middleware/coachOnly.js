const forbiddenError = require('./../functions/forbiddenError');

module.exports = (req, res, next) => {
    if (!req.isCoach) {
        next(forbiddenError());
    }
    next();
}