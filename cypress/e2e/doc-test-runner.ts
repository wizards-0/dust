function getDocGenCaller(testGroup: any) {
    return (done: any) => {
        let docRequest = {
            path: testGroup.path,
            content: testGroup.tests.map((test: any) => test.doc).join('\n')
        };

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:3030/doc");
        xhr.setRequestHeader("Content-Type", "text/plain");
        const body = JSON.stringify(docRequest);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                done();
            }
        };
        xhr.send(body);
    };
}
export function runDocTests(testGroup: any) {
    describe(testGroup.path, () => {
        after(getDocGenCaller(testGroup));
        testGroup.tests.forEach((test: any) => {
            it(test.title, () => {
                cy.wrap(
                    Cypress.automation('remote:debugger:protocol', {
                        command: 'Browser.grantPermissions',
                        params: {
                            permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
                            origin: window.location.origin,
                        }
                    })
                );

                cy.wrap(
                    Cypress.automation("remote:debugger:protocol", {
                        command: "Emulation.setFocusEmulationEnabled",
                        params: {
                            enabled: true
                        }
                    })
                );
                test.test();
            });
        });
    });
}