
import { MockedObjects } from '../../../test/mocks/mocked-objects';

import { GradleProcessor } from './gradle-processor';

describe('GradleProcessor', () => {
  let gradleProcessor: GradleProcessor;
  let mocks:MockedObjects;

  beforeAll(() => {

  });

  beforeEach(() => {
    mocks = new MockedObjects();
    gradleProcessor = new GradleProcessor(mocks.httpClient);
  });

  it('should create', () => {
    expect(gradleProcessor).toBeTruthy();
  });
});

