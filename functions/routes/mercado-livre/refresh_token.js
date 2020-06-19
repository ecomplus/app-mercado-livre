exports.post = ({ appSdk }, req, res) => {
  try {
    return res.send('ok')
  } catch (error) {
    return res.status(500).send(error)
  }
}