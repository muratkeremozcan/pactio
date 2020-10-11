// high level:
// (1) identify the MODEL which represents the data, and the data to be retrieved from the provider
// (2) identify the CONSUMER; the component which makes the HTTP calls to the provider 
// (3) create the MOCK PROVIDER; new Pact({...})
// (4) write the pact.io test and generate the pact file
// (5) supply the pact file to the PROVIDER (use a broker) and run the provider test


// (1) identify MODEL: identify the Model which represents the data returned from the Order API
class Order {
  constructor(id, items) {
    this.id = id
    this.items = items
  }

  total() {
    return this.items.reduce((acc, v) => {
      acc += v.quantity * v.value
      return acc
    }, 0)
  }

  toString() {
    return `Order ${this.id}, Total: ${this.total()}`
  }
}

module.exports = {
  Order,
}
