
const { LIBRARIES } = require('../utils/libraries');
const { APIS } = require('../utils/apis');

const getVersions = (req, res) => {
  res.json({ ok: true, packages: { libraries: LIBRARIES, apis: APIS } });
};

module.exports = { getVersions };
