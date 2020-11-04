const { expect } = require("chai");
const faker = require("faker");
const BalanceReserve = require("../balanceReserveService");

describe('test balance reserve features', () => {
  const sku = 'I/VO//4.1..31'
  const storeId = 1117

  it(`shold be return ${storeId}-I-VO--4_1__31 sku`, () => {
    const balanceReserve = new BalanceReserve(storeId, sku)
    const formattedSKU = balanceReserve.formatSKU(sku)
    expect(formattedSKU).to.be.equal(`${storeId}-I-VO--4_1__31`)
  })

  it('shold be increase random value', (done) => {
    const balanceReserve = new BalanceReserve(storeId, sku)
    const quantityToIncrease = faker.random.number(200)
    balanceReserve.increase(quantityToIncrease)
      .then(() => balanceReserve.getQuantity())
      .then(quantity => {
        expect(quantityToIncrease).to.be.equal(quantity)
        done()
      })
  })

  it('shold be decrease value', (done) => {
    const balanceReserve = new BalanceReserve(storeId, sku)
    const quantityToIncrease = 45
    balanceReserve.increase(quantityToIncrease)
      .then(() => balanceReserve.decrease(5))
      .then(() => balanceReserve.getQuantity())
      .then(quantity => {
        expect(quantity).to.be.equal(40)
        done()
      })
  })

  afterEach(() => {
    const balanceReserve = new BalanceReserve(storeId, sku)
    return balanceReserve.remove()
  })
})