// Разработчик: By ROlil Studio

(function(Scratch) {
  'use strict';

  const menuIconURI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PGNpcmNsZSBjeD0iNjQiIGN5PSI2NCIgcj0iNjAiIGZpbGw9IiNmZjk1MDAiLz48dGV4dCB4PSI0OCIgeT0iODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI1MCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmZmZmYiPlM8L3RleHQ+PC9zdmc+';

  class ScratchAPI {
    constructor() {
      this.lastError = 'Нет ошибок';
      this.searchResults = [];
      this.currentOffset = 0;
      this.lastQuery = '';
    }

    getInfo() {
      return {
        id: 'scratchapi',
        name: 'Scratch API',
        color1: '#ff9500',
        color3: '#ffffff',
        menuIconURI: menuIconURI,
        blocks: [
          {
            opcode: 'getProjectInfo',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get project info by ID [PROJECT_ID]',
            arguments: { PROJECT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '100' } }
          },
          {
            opcode: 'getUserInfo',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get user info by name [USERNAME]',
            arguments: { USERNAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'scratchcat' } }
          },
          {
            opcode: 'getStudioInfo',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get studio info by ID [STUDIO_ID]',
            arguments: { STUDIO_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '1000' } }
          },
          {
            opcode: 'getProjectComments',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get comments for project ID [PROJECT_ID]',
            arguments: { PROJECT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '100' } }
          },
          {
            opcode: 'getSiteStats',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get Scratch site statistics'
          },
          {
            opcode: 'getLastError',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Последняя ошибка'
          },
          {
            opcode: 'searchProjects',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Выполнить поиск проекта по [QUERY]',
            arguments: { QUERY: { type: Scratch.ArgumentType.STRING, defaultValue: 'game' } }
          },
          {
            opcode: 'getAllSearchResults',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Получить все проекты по поиску'
          },
          {
            opcode: 'resetSearch',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Сбросить список поиска'
          }
        ]
      };
    }

    searchProjects(args) {
      const query = args.QUERY.trim();
      if (!query) {
        this.lastError = 'Empty query';
        return 'Empty query';
      }

      if (query !== this.lastQuery) {
        this.lastQuery = query;
        this.currentOffset = 0;
        this.searchResults = [];
      }

      const url = `http://localhost:8080/https://api.scratch.mit.edu/search/projects?q=${encodeURIComponent(query)}&offset=${this.currentOffset}&limit=15`;
      return new Promise(resolve => setTimeout(resolve, 1000))
        .then(() => Scratch.fetch(url, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://studio.penguinmod.com'
          }
        }))
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              if (response.status === 429 || text.includes('429')) {
                this.lastError = 'Too Many Requests (429)';
              } else if (response.status === 403) {
                this.lastError = 'Access denied (403)';
              } else if (response.status === 404) {
                this.lastError = 'Search endpoint not found';
              } else {
                this.lastError = `Server error: ${response.status} - ${text}`;
              }
              return this.lastError;
            });
          }
          return response.json();
        })
        .then(data => {
          if (typeof data === 'string') return data;
          if (!data || data.length === 0) {
            this.lastError = 'No projects found';
            return 'No projects found';
          }

          const formattedResults = data.map(project => {
            return (
              `projectName=${project.title}|||projectAuthor=${project.author.username}|||projectViews=${project.stats.views}|||projectLikes=${project.stats.loves}|||projectLink=https://scratch.mit.edu/projects/${project.id}`
            );
          });

          this.searchResults = this.searchResults.concat(formattedResults);
          this.currentOffset += 15;
          this.lastError = 'Нет ошибок';
          return formattedResults.join('--------------------------------------');
        })
        .catch(error => {
          this.lastError = `Network error: ${error.message}`;
          if (error.message.includes('429')) this.lastError = 'Too Many Requests (429)';
          return this.lastError;
        });
    }

    getAllSearchResults() {
      if (this.searchResults.length === 0) {
        this.lastError = 'No search results';
        return 'No search results';
      }
      this.lastError = 'Нет ошибок';
      return this.searchResults.join('--------------------------------------');
    }

    resetSearch() {
      this.searchResults = [];
      this.currentOffset = 0;
      this.lastQuery = '';
      this.lastError = 'Нет ошибок';
    }

    getProjectInfo(args) {
      const projectId = args.PROJECT_ID;
      if (!projectId || isNaN(projectId)) {
        this.lastError = 'Invalid ID';
        return 'Invalid ID';
      }
      return Scratch.fetch(`https://trampoline.turbowarp.org/api/projects/${projectId}`)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              if (response.status === 429 || text.includes('429')) {
                this.lastError = 'Too Many Requests (429)';
              } else if (response.status === 404) {
                this.lastError = 'Project not found';
              } else {
                this.lastError = `Server error: ${response.status} - ${text}`;
              }
              return this.lastError;
            });
          }
          return response.json();
        })
        .then(data => {
          if (typeof data === 'string') return data;
          if (data.title && data.author && data.stats) {
            this.lastError = 'Нет ошибок';
            return (
              `projectName=${data.title}|||projectAuthor=${data.author.username}|||projectViews=${data.stats.views}|||projectLikes=${data.stats.loves}|||projectLink=https://scratch.mit.edu/projects/${projectId}`
            );
          }
          this.lastError = 'Project not found';
          return 'Project not found';
        })
        .catch(error => {
          this.lastError = `Network error: ${error.message}`;
          if (error.message.includes('429')) this.lastError = 'Too Many Requests (429)';
          return this.lastError;
        });
    }

    getUserInfo(args) {
      const username = args.USERNAME;
      if (!username) {
        this.lastError = 'Invalid username';
        return 'Invalid username';
      }
      return Scratch.fetch(`https://trampoline.turbowarp.org/api/users/${username}`)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              if (response.status === 429 || text.includes('429')) {
                this.lastError = 'Too Many Requests (429)';
              } else if (response.status === 404) {
                this.lastError = 'User not found';
              } else {
                this.lastError = `Server error: ${response.status} - ${text}`;
              }
              return this.lastError;
            });
          }
          return response.json();
        })
        .then(data => {
          if (typeof data === 'string') return data;
          if (data.username && data.id) {
            const joinedUnix = Math.floor(new Date(data.history.joined).getTime() / 1000);
            this.lastError = 'Нет ошибок';
            return (
              `username=${data.username}|||userId=${data.id}|||joined=${joinedUnix}|||bio=${data.profile.bio}`
            );
          }
          this.lastError = 'User not found';
          return 'User not found';
        })
        .catch(error => {
          this.lastError = `Network error: ${error.message}`;
          if (error.message.includes('429')) this.lastError = 'Too Many Requests (429)';
          return this.lastError;
        });
    }

    getStudioInfo(args) {
      const studioId = args.STUDIO_ID;
      if (!studioId || isNaN(studioId)) {
        this.lastError = 'Invalid ID';
        return 'Invalid ID';
      }
      return Scratch.fetch(`https://trampoline.turbowarp.org/api/studios/${studioId}`)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              if (response.status === 429 || text.includes('429')) {
                this.lastError = 'Too Many Requests (429)';
              } else if (response.status === 404) {
                this.lastError = 'Studio not found';
              } else {
                this.lastError = `Server error: ${response.status} - ${text}`;
              }
              return this.lastError;
            });
          }
          return response.json();
        })
        .then(data => {
          if (typeof data === 'string') return data;
          if (data.title && data.id) {
            this.lastError = 'Нет ошибок';
            return (
              `studioName=${data.title}|||studioId=${data.id}|||description=${data.description}|||projectCount=${data.stats.projects}`
            );
          }
          this.lastError = 'Studio not found';
          return 'Studio not found';
        })
        .catch(error => {
          this.lastError = `Network error: ${error.message}`;
          if (error.message.includes('429')) this.lastError = 'Too Many Requests (429)';
          return this.lastError;
        });
    }

    getProjectComments(args) {
      const projectId = args.PROJECT_ID;
      if (!projectId || isNaN(projectId)) {
        this.lastError = 'Invalid ID';
        return 'Invalid ID';
      }
      return Scratch.fetch(`https://trampoline.turbowarp.org/api/projects/${projectId}/comments`)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              if (response.status === 429 || text.includes('429')) {
                this.lastError = 'Too Many Requests (429)';
              } else if (response.status === 404) {
                this.lastError = 'Comments not found';
              } else {
                this.lastError = `Server error: ${response.status} - ${text}`;
              }
              return this.lastError;
            });
          }
          return response.json();
        })
        .then(data => {
          if (typeof data === 'string') return data;
          if (data && data.length > 0 && data[0].author) {
            const comment = data[0];
            const dateUnix = Math.floor(new Date(comment.datetime_created).getTime() / 1000);
            this.lastError = 'Нет ошибок';
            return (
              `author=${comment.author.username}|||content=${comment.content}|||date=${dateUnix}`
            );
          }
          this.lastError = 'No comments';
          return 'No comments';
        })
        .catch(error => {
          this.lastError = `Network error: ${error.message}`;
          if (error.message.includes('429')) this.lastError = 'Too Many Requests (429)';
          return this.lastError;
        });
    }

    getSiteStats() {
      return Scratch.fetch('https://trampoline.turbowarp.org/proxy/scratch-api/stats/project-count')
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              if (response.status === 429 || text.includes('429')) {
                this.lastError = 'Too Many Requests (429)';
              } else {
                this.lastError = `Server error: ${response.status} - ${text}`;
              }
              return this.lastError;
            });
          }
          return response.json();
        })
        .then(data => {
          if (typeof data === 'string') return data;
          if (data.total) {
            this.lastError = 'Нет ошибок';
            return `totalProjects=${data.total}`;
          }
          this.lastError = 'Stats not available';
          return 'Stats not available';
        })
        .catch(error => {
          this.lastError = `Network error: ${error.message}`;
          if (error.message.includes('429')) this.lastError = 'Too Many Requests (429)';
          return this.lastError;
        });
    }

    getLastError() {
      return this.lastError;
    }
  }

  Scratch.extensions.register(new ScratchAPI());
})(Scratch);
