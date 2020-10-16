import path from "path";
import {Pact} from "@pact-foundation/pact";
import {API} from "./api";
import {eachLike, like} from "@pact-foundation/pact/dsl/matchers";

// high level: 
// (3) create the MOCK PROVIDER; new Pact({...})
// (4) write the pact.io test and generate the pact file
// (5) supply the pact file to the PROVIDER (use a broker) and run the provider test

// (3) create the MOCK PROVIDER
const provider = new Pact({
    consumer: 'FrontendWebsite',
    provider: 'ProductService',
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    logLevel: "warn",
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2
});

// (4) write the pact.io test and generate the pact file
describe("API Pact test", () => {

    // (4.1) start the MOCK PROVIDER, then verify each pact
    beforeAll(() => provider.setup());
    afterEach(() => provider.verify());
    // (4.4) record the pact
    afterAll(() => provider.finalize());

    describe("getting all products", () => {
        test("products exists", async () => {

            // (4.2) set up pact interactions
            await provider.addInteraction({
                state: 'products exist',
                uponReceiving: 'get all products',
                withRequest: {
                    method: 'GET',
                    path: '/products',
                    headers: {
                        "Authorization": like("Bearer 2019-01-14T11:34:18.045Z") // handle authorization
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    body: eachLike({ // (4.2) use the response estimate (eachLike): "the response will be something like this"
                        id: "09",
                        type: "CREDIT_CARD",
                        name: "Gem Visa"
                    }),
                },
            });

            // (4.3) execute the test
            const api = new API(provider.mockService.baseUrl);
            // make request to Pact mock server
            const product = await api.getAllProducts();

            expect(product).toStrictEqual([
                {"id": "09", "name": "Gem Visa", "type": "CREDIT_CARD"}
            ]);
        });

        test("no products exists", async () => {

            // (4.2) set up pact interactions
            await provider.addInteraction({
                state: 'no products exist',
                uponReceiving: 'get all products',
                withRequest: {
                    method: 'GET',
                    path: '/products',
                    headers: {
                        "Authorization": like("Bearer 2019-01-14T11:34:18.045Z") // handle authorization
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    body: []
                },
            });

             // (4.3) execute the test
            const api = new API(provider.mockService.baseUrl);
            // make request to Pact mock server
            const product = await api.getAllProducts();

            expect(product).toStrictEqual([]);
        });

        test("no auth token", async () => {

            // (4.2) set up pact interactions
            await provider.addInteraction({
                state: 'products exist',
                uponReceiving: 'get all products with no auth token',
                withRequest: {
                    method: 'GET',
                    path: '/products'
                },
                willRespondWith: {
                    status: 401
                },
            });

            // (4.3) execute the test
            const api = new API(provider.mockService.baseUrl);
            // make request to Pact mock server
            await expect(api.getAllProducts()).rejects.toThrow("Request failed with status code 401");
        });
    });

    describe("getting one product", () => {
        test("ID 10 exists", async () => {

            // (4.2) set up pact interactions
            await provider.addInteraction({
                state: 'product with ID 10 exists',
                uponReceiving: 'get product with ID 10',
                withRequest: {
                    method: 'GET',
                    path: '/product/10',
                    headers: {
                        "Authorization": like("Bearer 2019-01-14T11:34:18.045Z") // handle authorization
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    body: like({
                        id: "10",
                        type: "CREDIT_CARD",
                        name: "28 Degrees"
                    }),
                },
            });

            // (4.3) execute the test
            const api = new API(provider.mockService.baseUrl);
            // make request to Pact mock server
            const product = await api.getProduct("10");

            expect(product).toStrictEqual({
                id: "10",
                type: "CREDIT_CARD",
                name: "28 Degrees"
            });
        });

        test("product does not exist", async () => {

            // (4.2) set up pact interactions
            await provider.addInteraction({
                state: 'product with ID 11 does not exist',
                uponReceiving: 'get product with ID 11',
                withRequest: {
                    method: 'GET',
                    path: '/product/11',
                    headers: {
                        "Authorization": like("Bearer 2019-01-14T11:34:18.045Z") // handle authorization
                    }
                },
                willRespondWith: {
                    status: 404
                },
            });

            // (4.3) execute the test
            const api = new API(provider.mockService.baseUrl);
            // make request to Pact mock server
            await expect(api.getProduct("11")).rejects.toThrow("Request failed with status code 404");
        });

        test("no auth token", async () => {

            // (4.2) set up pact interactions
            await provider.addInteraction({
                state: 'product with ID 10 exists',
                uponReceiving: 'get product by ID 10 with no auth token',
                withRequest: {
                    method: 'GET',
                    path: '/product/10'
                },
                willRespondWith: {
                    status: 401
                },
            });

            // (4.3) execute the test
            const api = new API(provider.mockService.baseUrl);
            // make request to Pact mock server
            await expect(api.getProduct("10")).rejects.toThrow("Request failed with status code 401");
        });
    });
});