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
  // (4.1) setup the MOCK PROVIDER on a randomly available port,
  // and set its port so clients can dynamically find the endpoint  then verify each pact
  // This server acts as a Test Double for the real Provider API.
  // We then call addInteraction() for each test to configure the Mock Service to act like the Provider
  // It also sets up expectations for what requests are to come, and will fail if the calls are not seen.
  before(() =>
    provider.setup().then(opts => {
      process.env.API_PORT = opts.port
    })
  )
  // After each individual test (one or more interactions)  we validate that the correct request came through.
  // This ensures what we _expect_ from the provider, is actually what we've asked for (and is what gets captured in the contract)
  afterEach(() => provider.verify())

  describe('given there are orders', () => {

    // (4.2) set up the match to the response
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
        // Note that we don't call the consumer API endpoints directly, but use unit-style tests that test the collaborating function behaviour
        // we want to test the function that is calling the external service.
        return provider.addInteraction({
          state: 'there are orders',
          uponReceiving: 'a request for orders',
          withRequest: {
            path: '/orders',
            method: 'GET',
          },
          willRespondWith: {
            // (4.2) define the payload using flexible matchers
            // This makes the test much more resilient to changes in actual data.
            // Here we specify the 'shape' of the object that we care about.
            // It is also import here to not put in expectations for parts of the API we don't care about
            body: eachLike(orderProperties),
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
