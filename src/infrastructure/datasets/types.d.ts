import SystemDatasets from "../datasets/system";
import DemoDatasets from "../datasets/demo";

declare global {
    type Dataset = typeof SystemDatasets | typeof DemoDatasets;
}
