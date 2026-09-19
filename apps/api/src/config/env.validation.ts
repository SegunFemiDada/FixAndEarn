export type EnvironmentConfig =
  Record<string, unknown>;

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "ADMIN_JWT_SECRET",
  "ADMIN_REFRESH_SECRET",
  "RESEND_API_KEY",
  "MONNIFY_API_KEY",
  "MONNIFY_SECRET_KEY",
  "MONNIFY_CONTRACT_CODE",
  "AWS_REKOGNITION_REGION",
  "AWS_REKOGNITION_COLLECTION_ID",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

function getString(
  config: EnvironmentConfig,
  name: string,
): string | undefined {
  const value = config[name];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function requireString(
  config: EnvironmentConfig,
  name: string,
): void {
  if (!getString(config, name)) {
    throw new Error(
      `Environment variable "${name}" is required.`,
    );
  }
}

function validateInteger(
  config: EnvironmentConfig,
  name: string,
  options: {
    min?: number;
    max?: number;
  } = {},
): void {
  const value = getString(
    config,
    name,
  );

  if (value === undefined) {
    return;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    (options.min !== undefined &&
      parsed < options.min) ||
    (options.max !== undefined &&
      parsed > options.max)
  ) {
    const range =
      options.min !== undefined &&
      options.max !== undefined
        ? ` between ${options.min} and ${options.max}`
        : options.min !== undefined
          ? ` greater than or equal to ${options.min}`
          : options.max !== undefined
            ? ` less than or equal to ${options.max}`
            : "";

    throw new Error(
      `Environment variable "${name}" must be an integer${range}.`,
    );
  }
}

function validateNumber(
  config: EnvironmentConfig,
  name: string,
  options: {
    min?: number;
    max?: number;
  } = {},
): void {
  const value = getString(
    config,
    name,
  );

  if (value === undefined) {
    return;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    (options.min !== undefined &&
      parsed < options.min) ||
    (options.max !== undefined &&
      parsed > options.max)
  ) {
    throw new Error(
      `Environment variable "${name}" must be a valid number.`,
    );
  }
}

function validateUrl(
  config: EnvironmentConfig,
  name: string,
): void {
  const value = getString(
    config,
    name,
  );

  if (value === undefined) {
    return;
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      `Environment variable "${name}" must be a valid URL.`,
    );
  }

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      `Environment variable "${name}" must use http or https.`,
    );
  }
}

function validateBase64Key(
  config: EnvironmentConfig,
  name: string,
  expectedBytes: number,
): void {
  const value = getString(
    config,
    name,
  );

  if (value === undefined) {
    return;
  }

  let decoded: Buffer;

  try {
    decoded = Buffer.from(
      value,
      "base64",
    );
  } catch {
    throw new Error(
      `Environment variable "${name}" must be valid base64.`,
    );
  }

  if (
    decoded.length !== expectedBytes
  ) {
    throw new Error(
      `Environment variable "${name}" must decode to exactly ${expectedBytes} bytes.`,
    );
  }
}

export function validateEnvironment(
  config: EnvironmentConfig,
): EnvironmentConfig {
  const nodeEnv =
    getString(
      config,
      "NODE_ENV",
    ) ?? "development";

  if (
    ![
      "development",
      "test",
      "production",
    ].includes(nodeEnv)
  ) {
    throw new Error(
      'Environment variable "NODE_ENV" must be one of: development, test, production.',
    );
  }

  for (
    const name of REQUIRED_ENV_VARS
  ) {
    requireString(
      config,
      name,
    );
  }

  validateInteger(
    config,
    "API_PORT",
    {
      min: 1,
      max: 65535,
    },
  );

  validateInteger(
    config,
    "PRISMA_TRANSACTION_MAX_WAIT_MS",
    {
      min: 1,
    },
  );

  validateInteger(
    config,
    "PRISMA_TRANSACTION_TIMEOUT_MS",
    {
      min: 1,
    },
  );

  validateNumber(
    config,
    "FACE_MATCH_DUPLICATE_THRESHOLD",
    {
      min: 0,
      max: 100,
    },
  );

  validateUrl(
    config,
    "MONNIFY_BASE_URL",
  );

  validateUrl(
    config,
    "FRONTEND_URL",
  );

  validateUrl(
    config,
    "WEB_APP_URL",
  );

  validateBase64Key(
    config,
    "BANK_ENCRYPTION_KEY_B64",
    32,
  );

  return {
    ...config,
    NODE_ENV: nodeEnv,
  };
}