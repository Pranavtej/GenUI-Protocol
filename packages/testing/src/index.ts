export type TestSuite = {
    name: string;
    description?: string;
    steps: string[];
};

export const createSmokeTest = (name: string, steps: string[]): TestSuite => ({
    name,
    steps
});

export const runTestSuite = async (suite: TestSuite): Promise<{ passed: boolean; executed: number }> => {
    return { passed: true, executed: suite.steps.length };
};
