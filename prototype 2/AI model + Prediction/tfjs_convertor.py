'''
This python convertor acts as a way to wrap the tfjs conversion tool. This tool
was created to explicitly address 2 errors with the command line tool which I
was unable to fix over the course of working on this. This hence acts as a
temporary conversion workaround.

[1] - The file is weights only: an error in the CLI version which is ignored
in the python version.

[2] - Uncaught (in promise) Error: An InputLayer should be passed either a `batchInputShape` or an `inputShape`.
'''

import tensorflow as tf
import os

# [1]
model = tf.keras.models.load_model("asl_cnn_model_rel.h5")

# [2]
inp = tf.keras.Input(shape=(20, 3), name="input_layer")
new_model = tf.keras.models.clone_model(model, input_tensors=[inp])
new_model.set_weights(model.get_weights())

new_model.export("saved_model_dir")
os.system("tensorflowjs_converter --input_format=tf_saved_model \
           saved_model_dir tfjs_model")
os.system("rm -rf saved_model_dir")
