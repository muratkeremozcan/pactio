// (3) supply the pact file to the PROVIDER and run verify that the provider meets all consumer expectations

const Verifier = require('@pact-foundation/pact').Verifier // KEY
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getPort = require('get-port')
const { server } = require('./provider.js') // require the real PROVIDER
const { providerName, pactFile } = require('../pact.js') // require the MOCK PROVIDER
chai.use(chaiAsPromised)
let port
let opts

// Verify that the provider meets all consumer expectations
describe('Pact Verification', () => {
  before(async () => {
    port = await getPort()
    // (5.1) specify the options, this is where the administrative info is
    opts = { 
      provider: providerName,
      providerBaseUrl: `http://localhost:${port}`,
      // pactUrls: [pactFile], // if you don't use a broker
      pactBrokerUrl: 'https://test.pact.dius.com.au/',
      pactBrokerUsername: 'dXfltyFMgNOFZAxr8io9wJ37iUpY42M',
      pactBrokerPassword: 'O5AIZWxelWbLvqMd8PkAVycBJh2Psyg1',
      publishVerificationResult: true,
      tags: ['prod'],
      providerVersion: '1.0.' + process.env.HOSTNAME,
    }

    server.listen(port, () => {
      console.log(`Provider service listening on http://localhost:${port}`)
    })
  })

  // (5.2) execute the provider test using Verifier().verifyProvider to assert the options specified
  it('should validate the expectations of Order Web', () => {
    return new Verifier() //
      .verifyProvider(opts)
      .then(output => {
        console.log('Pact Verification Complete!')
        console.log(output)
      })
      .catch(e => {
        console.error('Pact verification failed :(', e)
      })
  })
})
