import { ConfigService } from "@nestjs/config";
import { SmsService } from "./sms.service";

describe(
  "SmsService",
  () => {
    const originalFetch =
      global.fetch;

    afterEach(() => {
      global.fetch =
        originalFetch;
      jest.restoreAllMocks();
    });

    function createService(
      overrides: Record<
        string,
        string
      > = {},
    ) {
      const values: Record<string, string> = {
        TERMII_API_KEY:
          "test-api-key",
        TERMII_SENDER_ID:
          "FixAndEarn",
        TERMII_BASE_URL:
          "https://api.ng.termii.com",
        ...overrides,
      };

      const config =
        {
          getOrThrow: jest.fn(
            (
              name: string,
            ) => {
              const value =
                values[name];

              if (
                value ===
                undefined
              ) {
                throw new Error(
                  `${name} missing`,
                );
              }

              return value;
            },
          ),
          get: jest.fn(
            (
              name: string,
              defaultValue?: string,
            ) =>
              values[name] ??
              defaultValue,
          ),
        } as unknown as ConfigService;

      return new SmsService(
        config,
      );
    }

    it(
      "sends a verification SMS through Termii",
      async () => {
        const service =
          createService();

        global.fetch =
          jest.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                message_id:
                  "123456789",
                message:
                  "Successfully Sent",
              }),
              {
                status: 200,
                headers: {
                  "Content-Type":
                    "application/json",
                },
              },
            ),
          );

        await expect(
          service.sendVerificationCode(
            "08012345678",
            "123456",
          ),
        ).resolves.toBeUndefined();

        expect(
          global.fetch,
        ).toHaveBeenCalledWith(
          "https://api.ng.termii.com/api/sms/send",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              to: "2348012345678",
              from: "FixAndEarn",
              sms:
                "Your FixAndEarn verification code is 123456. It expires in 10 minutes.",
              type: "plain",
              channel: "dnd",
              api_key:
                "test-api-key",
            }),
            signal:
              expect.any(
                AbortSignal,
              ),
          }),
        );
      },
    );

    it(
      "converts a Nigerian +234 number correctly",
      async () => {
        const service =
          createService();

        global.fetch =
          jest.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                message_id:
                  "123456789",
              }),
              {
                status: 200,
              },
            ),
          );

        await service.sendVerificationCode(
          "+234 801 234 5678",
          "123456",
        );

        const call =
          (
            global.fetch as jest.Mock
          ).mock.calls[0];

        const body =
          JSON.parse(
            call[1].body,
          );

        expect(body.to).toBe(
          "2348012345678",
        );
      },
    );

    it(
      "accepts an already international number",
      async () => {
        const service =
          createService();

        global.fetch =
          jest.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                message_id:
                  "123456789",
              }),
              {
                status: 200,
              },
            ),
          );

        await service.sendVerificationCode(
          "2348012345678",
          "123456",
        );

        const call =
          (
            global.fetch as jest.Mock
          ).mock.calls[0];

        const body =
          JSON.parse(
            call[1].body,
          );

        expect(body.to).toBe(
          "2348012345678",
        );
      },
    );

    it(
      "throws when Termii rejects the request",
      async () => {
        const service =
          createService();

        global.fetch =
          jest.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                message:
                  "Insufficient balance",
              }),
              {
                status: 400,
              },
            ),
          );

        await expect(
          service.sendVerificationCode(
            "08012345678",
            "123456",
          ),
        ).rejects.toThrow(
          "SMS_SEND_FAILED",
        );
      },
    );

    it(
      "throws when Termii returns an unsuccessful response without a message ID",
      async () => {
        const service =
          createService();

        global.fetch =
          jest.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                message:
                  "Request accepted without message ID",
              }),
              {
                status: 200,
              },
            ),
          );

        await expect(
          service.sendVerificationCode(
            "08012345678",
            "123456",
          ),
        ).rejects.toThrow(
          "SMS_SEND_FAILED",
        );
      },
    );

    it(
      "does not expose the OTP in logs",
      async () => {
        const service =
          createService();

        const loggerSpy =
          jest
            .spyOn(
              (service as any).logger,
              "log",
            )
            .mockImplementation();

        global.fetch =
          jest.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                message_id:
                  "123456789",
              }),
              {
                status: 200,
              },
            ),
          );

        await service.sendVerificationCode(
          "08012345678",
          "654321",
        );

        expect(
          loggerSpy.mock.calls
            .flat()
            .join(" "),
        ).not.toContain(
          "654321",
        );
      },
    );
  },
);