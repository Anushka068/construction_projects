"""Entry-point for training the production-grade cost overrun model."""

from ml.pipeline import CostOverrunPipeline


def main():
    pipeline = CostOverrunPipeline()
    pipeline.run()


if __name__ == "__main__":
    main()

