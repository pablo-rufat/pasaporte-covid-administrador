/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getAdministrador = /* GraphQL */ `
  query GetAdministrador($id: ID!) {
    getAdministrador(id: $id) {
      id
      address
      nome
      cpf
      cfm
      createdAt
      updatedAt
    }
  }
`;
export const listAdministradors = /* GraphQL */ `
  query ListAdministradors(
    $filter: ModelAdministradorFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAdministradors(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        address
        nome
        cpf
        cfm
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
