exports.get = ({ appSdk }, req, res) => {
  return res.json({
    query: req.query,
    appSdk
  })
}