
import { MockedObjects } from '../../../test/mocks/mocked-objects';

import { NodeProcessor } from './node-processor';

describe('NodeProcessor', () => {
  let nodeProcessor: NodeProcessor;
  let mocks:MockedObjects;

  beforeAll(() => {

  });

  beforeEach(() => {
    mocks = new MockedObjects();
    nodeProcessor = new NodeProcessor(mocks.httpClient);
  });

  it('should create', () => {
    expect(nodeProcessor).toBeTruthy();
  });
});

