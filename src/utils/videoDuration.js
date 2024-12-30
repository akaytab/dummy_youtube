import ffmeg from 'fluent-ffmpeg'

const getVideoDuration = (videoFilePath) => {
    return new Promise((resolve, reject) => {
        ffmeg.ffprobe(videoFilePath, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }
            const duration = metadata.format.duration;
            resolve(duration);
        });
    });
};

export {getVideoDuration}