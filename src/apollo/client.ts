import { ApolloClient, InMemoryCache } from '@apollo/client'

export const client = new ApolloClient({
  uri: 'https://api.studio.thegraph.com/query/44946/dotoli/v0.0.1',
  cache: new InMemoryCache({
    typePolicies: {
      Fund: {
        // Singleton types that have no identifying field can use an empty
        // array for their keyFields.
        keyFields: false,
      },
    },
  }),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})

export const blockClient = new ApolloClient({
  uri: 'https://api.studio.thegraph.com/query/44946/dotoli/v0.0.1',
  cache: new InMemoryCache(),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})
