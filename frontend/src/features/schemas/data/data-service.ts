import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';

// GraphQL query to fetch tasks
const GET_TASKS = gql`
  query GetTasks {
    tasks {
      id
      title
      description
      status
    }
  }
`

const client = new ApolloClient({
  uri: '/api/graphql',
  cache: new InMemoryCache(),
});


// Function to fetch tasks data
export async function fetchTasks() {
  try {
    const { data } = await client.query({ query: GET_TASKS })
    return data.tasks
  } catch (error) {
    console.error('Error fetching tasks:', error)
    throw error
  }
}