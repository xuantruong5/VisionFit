// trích xuất video
python extract_frames.py `
  --video videos/person01_pushup.mp4 `
  --out data/frames/person01 `
  --every 10 `
  --limit 250
-------------------------------------
//Gán nhãn 33 khớp cơ thể
python pose_annotator.py `
  --images data/frames/person01 `
  --out data/pose_real.npz `
  --subject person01 `
  --append


-------------------------------------
//xem và sửa lại những ảnh đã chấm
python pose_annotator.py `
  --images data/frames/person01 `
  --out data/pose_real.npz `
  --subject person01 `
  --review

-------------------------------------
4. Kiểm tra dataset sau khi gán nhãn
python -c "import numpy as np; d=np.load('data/pose_real.npz'); print('Images:',d['images'].shape); print('Keypoints:',d['keypoints'].shape); print('Subjects:',np.unique(d['subjects']))"

-------------------------------------
5. Tạo dataset train thử
python -c "import numpy as np; d=np.load('data/pose_real.npz'); np.savez_compressed('data/pose_debug.npz',images=d['images'],keypoints=d['keypoints'])"

-------------------------------------
6. Train model PoseNet tự xây dựng
python pose_model.py train `
  --data data/pose_debug.npz `
  --out models/pose_debug.pt `
  --epochs 30 `
  --batch 4 `
  --lr 0.001 `
  --device auto

/
----------------------------------------
lệnh kiễm tra số ảnh 
python -c "import numpy as np; d=np.load('data/pose_real.npz'); print('Images:',d['images'].shape); print('Keypoints:',d['keypoints'].shape)

  eyboardInterrupt
(.venv) PS E:\Downloads\visionfit-ai-pro> python pose_annotator.py `
>>   --images data/frames/person01 `
>>   --out data/pose_real.npz `
>>   --subject person01
Saved: frame_0000010.jpg
Stopped. Total saved: 1 -> data\pose_real.npz
(.venv) PS E:\Downloads\visionfit-ai-pro> Test-Path data/pose_real.npz^C
(.venv) PS E:\Downloads\visionfit-ai-pro> python -c "import cv2,glob; f=glob.glob('data/frames/person01/*.jpg'); im=cv2.imread(f[0]); print(im.shape if im is not None else 'Image error')"
(720, 1280, 3)
(.venv) PS E:\Downloads\visionfit-ai-pro> python -c "import numpy as np; d=np.load('data/pose_real.npz'); print('So anh:',len(d['images'])); print('Khop:',d['keypoints'].shape); print('Nguoi:',np.unique(d['subjects']))"
So anh: 22
Khop: (22, 33, 3)
Nguoi: ['person01']
(.venv) PS E:\Downloads\visionfit-ai-pro> python -c "import numpy as np; d=np.load('data/pose_real.npz'); print('Images:',d['images'].shape); print('Keypoints:',d['keypoints'].shape)"
Images: (22, 128, 128, 3)
Keypoints: (22, 33, 3)
(.venv) PS E:\Downloads\visionfit-ai-pro> python -c "import numpy as np; d=np.load('data/pose_real.npz'); np.savez_compressed('data/pose_debug.npz', images=d['images'], keypoints=d['keypoints'])"
(.venv) PS E:\Downloads\visionfit-ai-pro> python pose_model.py train `
>>   --data data/pose_debug.npz `
>>   --out models/pose_debug.pt `
>>   --epochs 30 `
>>   --batch 4 `
>>   --lr 0.001 `
>>   --device auto
WARNING: no subjects field. Random image split can leak identical people/videos.
pose epoch=001 train_loss=7.193 val_loss=7.607
pose epoch=002 train_loss=6.238 val_loss=7.581
pose epoch=003 train_loss=5.677 val_loss=7.545
pose epoch=004 train_loss=5.280 val_loss=7.504
pose epoch=005 train_loss=4.986 val_loss=7.418
pose epoch=006 train_loss=4.754 val_loss=7.262
pose epoch=007 train_loss=4.584 val_loss=6.956
pose epoch=008 train_loss=4.440 val_loss=6.620
pose epoch=009 train_loss=4.318 val_loss=6.047
pose epoch=010 train_loss=4.225 val_loss=5.687
pose epoch=011 train_loss=4.157 val_loss=5.183
pose epoch=012 train_loss=4.093 val_loss=5.126
pose epoch=013 train_loss=4.051 val_loss=4.728
pose epoch=014 train_loss=4.007 val_loss=4.599
pose epoch=015 train_loss=3.971 val_loss=4.502
pose epoch=016 train_loss=3.944 val_loss=4.413
pose epoch=017 train_loss=3.915 val_loss=4.408
pose epoch=018 train_loss=3.890 val_loss=4.354
pose epoch=019 train_loss=3.871 val_loss=4.343
pose epoch=020 train_loss=3.856 val_loss=4.335
pose epoch=021 train_loss=3.847 val_loss=4.271
pose epoch=022 train_loss=3.832 val_loss=4.292
pose epoch=023 train_loss=3.811 val_loss=4.248
pose epoch=024 train_loss=3.797 val_loss=4.249
pose epoch=025 train_loss=3.784 val_loss=4.255
pose epoch=026 train_loss=3.769 val_loss=4.255
pose epoch=027 train_loss=3.764 val_loss=4.234
pose epoch=028 train_loss=3.756 val_loss=4.203
pose epoch=029 train_loss=3.751 val_loss=4.191
pose epoch=030 train_loss=3.742 val_loss=4.185
Saved own pose model: models/pose_debug.pt. Assess landmark accuracy on unseen real images.
(.venv) PS E:\Downloads\visionfit-ai-pro> python test_pose_debug.py
E:\Downloads\visionfit-ai-pro\.venv\Scripts\python.exe: can't open file 'E:\\Downloads\\visionfit-ai-pro\\test_pose_debug.py': [Errno 2] No such file or directory
(.venv) PS E:\Downloads\visionfit-ai-pro> code test_pose_debug.py
(.venv) PS E:\Downloads\visionfit-ai-pro> python test_pose_debug.py
Saved 22 comparisons to reports\pose_debug
(.venv) PS E:\Downloads\visionfit-ai-pro> explorer .\reports\pose_debug