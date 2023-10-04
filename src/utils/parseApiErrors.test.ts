import parseApiErrors from './parseApiErrors';

const mockArrayValidationError = [
  {},
  {},
  {},
  {
    percentage: [
      {
        message: 'A valid number is required.',
        code: 'invalid',
      },
    ],
  },
  {},
  {},
  {},
  {},
];

const mockValidationError = {
  valid_from: [
    {
      message: 'cost index with this valid from already exists.',
      code: 'unique',
    },
  ],
};

function generateValidationError(errorData: any) {
  return {
    status: 400,
    data: errorData,
  };
}

describe('parseApiErrors', () => {
  it('parses array validation error properly', () => {
    expect(parseApiErrors(generateValidationError(mockArrayValidationError))).toMatchObject([
      'Row 4 - percentage: A valid number is required.',
    ]);
  });
  it('parses object validation error properly', () => {
    expect(parseApiErrors(generateValidationError(mockValidationError))).toMatchObject([
      'valid_from: cost index with this valid from already exists.',
    ]);
  });
  it('parses internal server error properly', () => {
    expect(parseApiErrors({ status: 500, data: 'foo' })).toMatchObject(['500 - Error']);
  });
});
