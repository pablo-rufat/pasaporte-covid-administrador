/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createAdministrador = /* GraphQL */ `
  mutation CreateAdministrador(
    $input: CreateAdministradorInput!
    $condition: ModelAdministradorConditionInput
  ) {
    createAdministrador(input: $input, condition: $condition) {
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
export const updateAdministrador = /* GraphQL */ `
  mutation UpdateAdministrador(
    $input: UpdateAdministradorInput!
    $condition: ModelAdministradorConditionInput
  ) {
    updateAdministrador(input: $input, condition: $condition) {
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
export const deleteAdministrador = /* GraphQL */ `
  mutation DeleteAdministrador(
    $input: DeleteAdministradorInput!
    $condition: ModelAdministradorConditionInput
  ) {
    deleteAdministrador(input: $input, condition: $condition) {
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
