#!/usr/bin/env python3
"""VisionFit AI - Unified Command Line Interface & Runner.

Usage examples:
  python run.py web                          # Start Web Dashboard server on port 8000
  python run.py analyze-pushup <video.mp4>   # Analyze push-up video with Biomechanical Engine
  python run.py analyze-squat <video.mp4>    # Analyze squat video with Biomechanical Engine
  python run.py export-pushup [--overwrite]  # Export side-by-side comparison frames
  python run.py train-pushup                 # Run knowledge distillation & retrain PoseNet
"""

import sys
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def run_web(args):
    import subprocess
    cmd = [sys.executable, str(ROOT / "web_server.py"), "--port", str(args.port)]
    if args.no_browser:
        cmd.append("--no-browser")
    subprocess.run(cmd)


def run_analyze_pushup(args):
    from analyzers.push_up_analyzer import analyze_push_up_video
    report = analyze_push_up_video(
        args.video,
        out_video_path=args.out,
        report_path=args.report,
        engine=args.engine,
    )
    print("\n[VisionFit AI] Ket qua phan tich Push-up:")
    print(f"  - Tong so reps: {report.get('repetition_count', 0)}")
    print(f"  - Reps dung chuan: {report.get('correct_reps', 0)}")
    print(f"  - Reps loi: {report.get('incorrect_reps', 0)}")
    print(f"  - Diem ky thuat: {report.get('overall_score', 0)}/100")
    if report.get("common_faults"):
        print(f"  - Loi thuong gap: {', '.join(report['common_faults'])}")


def run_analyze_squat(args):
    from analyzers.visionfit import analyze_squat_video
    report = analyze_squat_video(
        args.video,
        out_video_path=args.out,
        report_path=args.report,
        engine=args.engine,
    )
    print("\n[VisionFit AI] Ket qua phan tich Squat:")
    print(f"  - Tong so reps: {report.get('repetition_count', 0)}")
    print(f"  - Reps dung chuan: {report.get('correct_reps', 0)}")
    print(f"  - Reps loi: {report.get('incorrect_reps', 0)}")
    print(f"  - Diem ky thuat: {report.get('overall_score', 0)}/100")


def run_export_pushup(args):
    from exporters.export_pushup_comparisons import export_pushup_frames
    export_pushup_frames(overwrite=args.overwrite)


def run_train_pushup(args):
    from training.train_pushup_posenet import main as train_main
    train_main()


def main():
    parser = argparse.ArgumentParser(
        description="VisionFit AI Pro - Modular AI Engine Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # 1. web
    web_p = subparsers.add_parser("web", help="Start Web Dashboard on port 8000")
    web_p.add_argument("--port", type=int, default=8000, help="Port to serve (default: 8000)")
    web_p.add_argument("--no-browser", action="store_true", help="Do not auto-open browser")
    web_p.set_defaults(func=run_web)

    # 2. analyze-pushup
    pu_p = subparsers.add_parser("analyze-pushup", help="Analyze push-up video")
    pu_p.add_argument("video", help="Path to push-up video file")
    pu_p.add_argument("--out", default=None, help="Output annotated video path")
    pu_p.add_argument("--report", default=None, help="Output JSON report path")
    pu_p.add_argument("--engine", default="mediapipe", choices=["mediapipe", "posenet"])
    pu_p.set_defaults(func=run_analyze_pushup)

    # 3. analyze-squat
    sq_p = subparsers.add_parser("analyze-squat", help="Analyze squat video")
    sq_p.add_argument("video", help="Path to squat video file")
    sq_p.add_argument("--out", default=None, help="Output annotated video path")
    sq_p.add_argument("--report", default=None, help="Output JSON report path")
    sq_p.add_argument("--engine", default="posenet", choices=["mediapipe", "posenet"])
    sq_p.set_defaults(func=run_analyze_squat)

    # 4. export-pushup
    exp_p = subparsers.add_parser("export-pushup", help="Export comparison frames for gallery")
    exp_p.add_argument("--overwrite", action="store_true", help="Overwrite existing frames")
    exp_p.set_defaults(func=run_export_pushup)

    # 5. train-pushup
    trn_p = subparsers.add_parser("train-pushup", help="Train Dual-Head PoseNet on MPS GPU")
    trn_p.set_defaults(func=run_train_pushup)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(0)

    args.func(args)


if __name__ == "__main__":
    main()
