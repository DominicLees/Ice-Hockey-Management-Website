const forbiddenError = require('./../functions/forbiddenError');

module.exports = (req, res, next) => {
    if (!req.isPlayer) {
        next(forbiddenError());
    }
    next();
}