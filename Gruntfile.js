module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.registerTask('png', ['imagemin:png']);
  grunt.registerTask('jpg', ['imagemin:jpg']);
  // grunt.registerTask('imagemin', ['imagemin']);

  grunt.initConfig({
    watch: {
      options: {
        spawn: true,
        maxListeners:200
      },
      watch_1: {
        files: ['css/less/*.less'],
        tasks: ['less:less_1']
      }
    },
    less: { 
      less_1: {
        options: {
          paths: ['css/less/main.less']
        },
        files: {
          'css/main.css': 'css/less/main.less'        
        }
      }
    },
    imagemin: {
      png: {
        options: {
          optimizationLevel: 7
        },
        files: [
        {
          // Set to true to enable the following options…
          expand: true,
          // cwd is 'current working directory'
          cwd: 'images/src',
          src: ['*.png'],
          // Could also match cwd line above. i.e. project-directory/img/
          dest: 'images/',
          ext: '.png'
        }
        ]
      },
      jpg: {
        options: {
          progressive: true
        },
        files: [
        {
          // Set to true to enable the following options…
          expand: true,
          // cwd is 'current working directory'
          cwd: 'images/src',
          src: ['*.jpg'],
          // Could also match cwd. i.e. project-directory/img/
          dest: 'images/',
          ext: '.jpg'
        }
        ]
      },
      gif: {
        files: [
        {
          // Set to true to enable the following options…
          expand: true,
          // cwd is 'current working directory'
          cwd: 'images/src',
          src: ['*.gif'],
          // Could also match cwd. i.e. project-directory/img/
          dest: 'images/',
          ext: '.gif'
        }
        ]
      }
    }
  });
};
