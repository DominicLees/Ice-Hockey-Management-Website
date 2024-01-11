module.exports = () => {
    const error = new Error('Forbidden');
    error.status = 403;
    return error;
}
