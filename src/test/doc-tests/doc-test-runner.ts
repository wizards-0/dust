import { test } from '@playwright/test';
import * as fs from 'node:fs';

function generateDoc(testGroup: any) {
    const path = ('./public/docs/' + testGroup.path).replace('//', '/');
    const content = testGroup.tests.map((test: any) => test.doc).join('\n')

    try {
        fs.writeFileSync(path, content);
        // file written successfully
    } catch (err) {
        console.error(err);
    }
}

export function runDocTests(testGroup: any) {
    test.describe(testGroup.path, () => {
        test.afterAll(() => {
            generateDoc(testGroup);
        });
        testGroup.tests.forEach((docTest: any) => {
            test(docTest.title, async ({ page, context }) => {
                await docTest.test(page,context);
            });
        });
    });
}

export function getDocGenCaller(testGroup: any) {
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