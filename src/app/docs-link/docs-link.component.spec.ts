import { MockedObjects } from '../../test/mocks/mocked-objects';
import { DocsLinkComponent } from './docs-link.component';

describe('DocsLinkComponent', () => {
  let component: DocsLinkComponent;
  let mocks:MockedObjects;
  beforeEach(() => {
    mocks = new MockedObjects();
    component = new DocsLinkComponent(mocks.settingsService,mocks.domSanitizer as any)
  })
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
