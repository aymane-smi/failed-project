exports.is_authenticated = (req, res, next)=>{
    if (req.session.user !== undefined) {
        return next();
      }
      res.status(401).send('Authentication required');
};