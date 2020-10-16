// (4) write the pact.io test

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { eachLike } = require('@pact-foundation/pact').Matchers
const { Order } = require('./order')
const expect = chai.expect
const { fetchOrders } = require('./orderClient') // KEY: the CONSUMER which makes the HTTP calls to the provider
const { provider } = require('../pact') // KEY: the MOCK PROVIDER
chai.use(chaiAsPromised)

describe('Pact with Order API', () => {
  // (4.1) start the MOCK PROVIDER on a randomly available port,
  // and set its port so clients can dynamically find the endpoint
  // then verify each pact
  before(() =>
    provider.setup().then(opts => {
      process.env.API_PORT = opts.port
    })
  )
  afterEach(() => provider.verify())

  describe('given there are orders', () => {

    // (4.2) set up the response
    const itemProperties = {
      name: 'burger',
      quantity: 2,
      value: 100,
    }

    const orderProperties = {
      id: 1,
      items: eachLike(itemProperties),
    }

    describe('when a call to the API is made', () => {
      before(() => {
        // (4.2) set up pact interactions
        return provider.addInteraction({
          state: 'there are orders',
          uponReceiving: 'a request for orders',
          withRequest: {
            path: '/orders',
            method: 'GET',
          },
          willRespondWith: {
            body: eachLike(orderProperties), // (4.2) use the response estimate (eachLike): "the response will be something like this"
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
          },
        })
      })

      it('will receive the list of current orders', () => {
        // (4.3) execute the test
        return expect(fetchOrders()).to.eventually.have.deep.members([
          new Order(orderProperties.id, [itemProperties]),
        ])
      })
    })
  })

  // (4.4) record the pact
  after(() => {0
    return provider.finalize()
  })
})
