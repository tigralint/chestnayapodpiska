const fs = require('fs');

const file = 'api/tgWebhook.test.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /expect\(consoleSpy\.mock\.calls\[0\]\[0\]\)\.toContain\('tgWebhook_answerCallback'\);/,
    "expect(consoleSpy.mock.calls[0]![0]).toContain('tgWebhook_answerCallback');"
);

code = code.replace(
    /expect\(consoleSpy\.mock\.calls\[1\]\[0\]\)\.toContain\('tgWebhook_editMessage'\);/,
    "expect(consoleSpy.mock.calls[1]![0]).toContain('tgWebhook_editMessage');"
);

fs.writeFileSync(file, code);
