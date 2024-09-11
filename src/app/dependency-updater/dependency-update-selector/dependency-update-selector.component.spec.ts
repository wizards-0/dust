import { MockedObjects } from '../../../test/mocks/mocked-objects';

import { DependencyUpdateSelectorComponent } from './dependency-update-selector.component';

describe('DependencyUpdateSelectorComponent', () => {
  let component: DependencyUpdateSelectorComponent;
  let mocks:MockedObjects;

  beforeAll(() => {
  });

  beforeEach(() => {
    mocks = new MockedObjects();
    component = new DependencyUpdateSelectorComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

