import Ember from 'ember';
import V2FallbackSerializer from 'travis/serializers/v2_fallback';

var Serializer = V2FallbackSerializer.extend({
  isNewSerializerAPI: true,
  attrs: {
    _config: {
      key: 'config'
    },
    _finished_at: {
      key: 'finished_at'
    },
    _started_at: {
      key: 'started_at'
    },
    _duration: {
      key: 'duration'
    }
  },

  extractRelationships: function(modelClass, resourceHash) {
    var result;
    result = this._super(modelClass, resourceHash);
    return result;
  },

  normalizeArrayResponse: function(store, primaryModelClass, payload, id, requestType) {
    var result;
    if (payload.commits) {
      payload.builds.forEach(function(build) {
        var commit, commit_id;
        commit_id = build.commit_id;
        if (commit = payload.commits.findBy('id', commit_id)) {
          build.commit = commit;
          return delete build.commit_id;
        }
      });
    }
    return this._super.apply(this, arguments);
  },

  keyForV2Relationship: function(key, typeClass, method) {
    if(key === 'jobs') {
      return 'job_ids';
    } else if (key === 'repo') {
      return 'repository_id';
    } else if (key === 'commit') {
      return key;
    } else {
      return this._super.apply(this, arguments);
    }
  },

  keyForRelationship(key, typeClass, method) {
    if (key === 'repo') {
      return 'repository';
    } else {
      return this._super.apply(this, arguments);
    }
  },

  normalize: function(modelClass, resourceHash) {
    var data, href, id, repoId, result;

    // TODO: remove this after switching to V3 entirely
    if(!resourceHash['@type']) {
      let build = resourceHash.build,
          commit = resourceHash.commit;
      let branch = {
        name: commit.branch,
        default_branch: build.is_on_default_branch,
        "@href": `/repo/${build.repository_id}/branch/${commit.branch}`
      };
      resourceHash.build.branch = branch;
    }

    result = this._super(modelClass, resourceHash);

    data = result.data;

    if (repoId = resourceHash.repository_id) {
      data.attributes.repositoryId = repoId;
    } else if (resourceHash.repository) {
      if (href = resourceHash.repository['@href']) {
        id = href.match(/\d+/)[0];
        data.attributes.repositoryId = id;
      }
    }
    return result;
  }
});

export default Serializer;