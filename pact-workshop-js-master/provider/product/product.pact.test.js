const { Verifier } = require('@pact-foundation/pact');
const controller = require('./product.controller');
const Product = require('./product');

// (5) supply the pact file to the PROVIDER and run verify that the provider meets all consumer expectations

const app = require('express')();
const authMiddleware = require('../middleware/auth.middleware');
app.use(authMiddleware);
app.use(require('./product.routes'));
const server = app.listen("8080");

describe("Pact Verification", () => {
    it("validates the expectations of ProductService", () => {
        
        // (5.1) specify the options, this is where the administrative info is
        const opts = {
            logLevel: "INFO",
            providerBaseUrl: "http://localhost:8080",
            provider: "ProductService",
            providerVersion: "1.0.0",
            pactBrokerUrl: process.env.PACT_BROKER_URL || "http://localhost:8000",
            pactBrokerUsername: process.env.PACT_BROKER_USERNAME || "pact_workshop",
            pactBrokerPassword: process.env.PACT_BROKER_PASSWORD || "pact_workshop",
            // setup states: the state <value>s have to match the consumer's addInteraction({state: '<value>'})
            // KEY this is how we enable tests themselves to be stateless in Pact.io
            // note: For each interaction in a pact file, the order of execution is as follows:
            // BeforeEach -> StateHandler -> RequestFilter (pre) -> Execute Provider Test -> RequestFilter (post) -> AfterEach
            stateHandlers: {
                "product with ID 10 exists": () => {
                    controller.repository.products = new Map([
                        ["10", new Product("10", "CREDIT_CARD", "28 Degrees", "v1")]
                    ]);
                },
                "products exist": () => {
                    controller.repository.products = new Map([
                        ["09", new Product("09", "CREDIT_CARD", "Gem Visa", "v1")],
                        ["10", new Product("10", "CREDIT_CARD", "28 Degrees", "v1")]
                    ]);
                },
                "no products exist": () => {
                    controller.repository.products = new Map();
                },
                "product with ID 11 does not exist": () => {
                    controller.repository.products = new Map();
                },
            },
            // handle authorization
            requestFilter: (req, res, next) => {
                if (!req.headers["authorization"]) {
                    next();
                    return;
                }
                req.headers["authorization"] = `Bearer ${new Date().toISOString()}`;
                next();
            },
        };

        if (process.env.CI || process.env.PACT_PUBLISH_RESULTS) {
            Object.assign(opts, {
                publishVerificationResult: true,
            });
        }

        // (5.2) execute the provider test using Verifier().verifyProvider to assert the options specified
        return new Verifier(opts).verifyProvider().then(output => {
            console.log(output);
        }).finally(() => {
            server.close();
        });
    })
});