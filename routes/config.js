const express = require('express');
const router = express.Router();

router.get("/proclist", (req, res) => {
    exec("sudo find /var/run/screen/S-root -type p -printf '%TY-%Tm-%Td %TH:%TM:%.2TS %f\\n'", (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`<pre>Error: ${error.message}</pre>`);
        }
        if (stderr) {
            return res.status(500).send(`<pre>Shell Error: ${stderr}</pre>`);
        }
        res.send(`<pre>${stdout}</pre>`);
    });
});

module.exports = router;
