import {
  validateEnvironment,
} from "./env.validation";

function createValidConfig(): Record<
  string,
  unknown
> {
  return {
    NODE_ENV: "development",
    DATABASE_URL:
      "postgresql://postgres:postgres@localhost:5432/fixandearn",
    JWT_ACCESS_SECRET:
      "test-access-secret",
    ADMIN_JWT_SECRET:
      "test-admin-jwt-secret",
    ADMIN_REFRESH_SECRET:
      "test-admin-refresh-secret",
    RESEND_API_KEY:
      "re_test_key",
    MONNIFY_API_KEY:
      "test-monnify-api-key",
    MONNIFY_SECRET_KEY:
      "test-monnify-secret-key",
    MONNIFY_CONTRACT_CODE:
      "1234567890",
    MONNIFY_BASE_URL:
      "https://sandbox.monnify.com",
    AWS_REKOGNITION_REGION:
      "eu-west-1",
    AWS_REKOGNITION_COLLECTION_ID:
      "test-collection",
    CLOUDINARY_CLOUD_NAME:
      "test-cloud",
    CLOUDINARY_API_KEY:
      "test-api-key",
    CLOUDINARY_API_SECRET:
      "test-api-secret",
    TERMII_API_KEY:
      "test-termii-api-key",
    TERMII_SENDER_ID:
      "FixAndEarn",
  };
}

describe(
  "validateEnvironment",
  () => {
    it(
      "accepts a valid testing configuration",
      () => {
        const config =
          createValidConfig();

        expect(
          validateEnvironment(
            config,
          ),
        ).toEqual({
          ...config,
          NODE_ENV:
            "development",
        });
      },
    );

    it(
      "accepts the Monnify sandbox URL",
      () => {
        const config =
          createValidConfig();

        config.MONNIFY_BASE_URL =
          "https://sandbox.monnify.com";

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).not.toThrow();
      },
    );

    it(
      "accepts the Monnify production URL",
      () => {
        const config =
          createValidConfig();

        config.MONNIFY_BASE_URL =
          "https://api.monnify.com";

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).not.toThrow();
      },
    );

    it(
      "accepts the default Termii Nigeria base URL",
      () => {
        const config =
          createValidConfig();

        delete config.TERMII_BASE_URL;

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).not.toThrow();
      },
    );

    it(
      "accepts a custom Termii base URL",
      () => {
        const config =
          createValidConfig();

        config.TERMII_BASE_URL =
          "https://api.ng.termii.com";

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).not.toThrow();
      },
    );

    it(
      "rejects an invalid NODE_ENV",
      () => {
        const config =
          createValidConfig();

        config.NODE_ENV =
          "staging";

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).toThrow(
          'Environment variable "NODE_ENV" must be one of: development, test, production.',
        );
      },
    );

    it(
      "rejects a missing required environment variable",
      () => {
        const config =
          createValidConfig();

        delete config.MONNIFY_API_KEY;

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).toThrow(
          'Environment variable "MONNIFY_API_KEY" is required.',
        );
      },
    );

    it(
      "rejects a missing Termii API key",
      () => {
        const config =
          createValidConfig();

        delete config.TERMII_API_KEY;

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).toThrow(
          'Environment variable "TERMII_API_KEY" is required.',
        );
      },
    );

    it(
      "rejects a missing Termii sender ID",
      () => {
        const config =
          createValidConfig();

        delete config.TERMII_SENDER_ID;

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).toThrow(
          'Environment variable "TERMII_SENDER_ID" is required.',
        );
      },
    );

    it(
      "rejects an invalid Monnify URL",
      () => {
        const config =
          createValidConfig();

        config.MONNIFY_BASE_URL =
          "not-a-url";

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).toThrow(
          'Environment variable "MONNIFY_BASE_URL" must be a valid URL.',
        );
      },
    );

    it(
      "rejects an invalid Termii URL",
      () => {
        const config =
          createValidConfig();

        config.TERMII_BASE_URL =
          "not-a-url";

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).toThrow(
          'Environment variable "TERMII_BASE_URL" must be a valid URL.',
        );
      },
    );

    it(
      "rejects an invalid API port",
      () => {
        const config =
          createValidConfig();

        config.API_PORT =
          "70000";

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).toThrow(
          'Environment variable "API_PORT" must be an integer between 1 and 65535.',
        );
      },
    );

    it(
      "rejects an invalid face match threshold",
      () => {
        const config =
          createValidConfig();

        config.FACE_MATCH_DUPLICATE_THRESHOLD =
          "101";

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).toThrow(
          'Environment variable "FACE_MATCH_DUPLICATE_THRESHOLD" must be a valid number.',
        );
      },
    );

    it(
      "accepts a valid 32-byte bank encryption key",
      () => {
        const config =
          createValidConfig();

        config.BANK_ENCRYPTION_KEY_B64 =
          Buffer.alloc(
            32,
          ).toString(
            "base64",
          );

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).not.toThrow();
      },
    );

    it(
      "rejects a bank encryption key with the wrong size",
      () => {
        const config =
          createValidConfig();

        config.BANK_ENCRYPTION_KEY_B64 =
          Buffer.alloc(
            16,
          ).toString(
            "base64",
          );

        expect(() =>
          validateEnvironment(
            config,
          ),
        ).toThrow(
          'Environment variable "BANK_ENCRYPTION_KEY_B64" must decode to exactly 32 bytes.',
        );
      },
    );
  },
);