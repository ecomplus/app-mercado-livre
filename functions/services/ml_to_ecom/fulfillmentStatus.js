const getStatus = (mlStatus, substatus) => {
  let status
  switch (mlStatus) {
    case 'ready_to_ship':
      status = 'ready_for_shipping'
      break;
    case 'shipped':
      status = 'shipped'
      break;
    case 'delivered':
      status = 'delivered'
      break;
    case 'delivered':
      status = 'delivered'
      break;
    case 'not_delivered':
      status = 'returned'
    default:
      break;
  }
  return status
}

exports.getStatus = getStatus