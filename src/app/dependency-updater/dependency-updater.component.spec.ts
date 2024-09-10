import { ExpressionEvaluator } from 'expression-evaluator';
import { MockedObjects } from 'src/test/mocked-objects';

import { DependencyUpdaterComponent } from './dependency-updater.component';

describe('DependencyUpdaterComponent', () => {
  let component: DependencyUpdaterComponent;
  let mocks:MockedObjects;

  beforeAll(() => {
    ExpressionEvaluator.initialize();
  });

  beforeEach(() => {
    mocks = new MockedObjects();
    component = new DependencyUpdaterComponent(mocks.httpClient, mocks.clipboard);
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

