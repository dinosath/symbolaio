import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: '/api/graphql',
  cache: new InMemoryCache(),
});


// GraphQL queries and mutations
const GET_USERS = gql`
  query GetUsers {
    users {
      nodes {
        id
        username
        createdAt
        email
      }
    }
  }
`

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
      email
      createdAt
    }
  }
`

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      username
      email
      updatedAt
    }
  }
`

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      id
    }
  }
`

// Service functions
export async function fetchUsers() {
  try {
    const { data } = await client.query({ query: GET_USERS })
    if (!data || !data.users) {
      throw new Error('No users found')
    }
    return data.users.nodes
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

export async function createUser(input: { username: string; email: string }) {
  try {
    const { data } = await client.mutate({
      mutation: CREATE_USER,
      variables: { input },
    })
    return data.createUser
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function updateUser(id: string, input: { username?: string; email?: string }) {
  try {
    const { data } = await client.mutate({
      mutation: UPDATE_USER,
      variables: { id, input },
    })
    return data.updateUser
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

export async function deleteUser(id: string) {
  try {
    const { data } = await client.mutate({
      mutation: DELETE_USER,
      variables: { id },
    })
    return data.deleteUser
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}