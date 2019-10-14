var express = require('express');
var router = express.Router();
//router.get('/', userController.login_page);
router.get('/',  function(req, res){
    res.send('Welcome to project RESTful API with JWT');
});


module.exports = router;
