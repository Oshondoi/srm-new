const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1OTg3MTZlYy03NTQwLTQ0YjUtYTBlNy1kMzcwOGI5Y2NmMTUiLCJhY2NvdW50SWQiOiJhZTAzMGMwZi1jYzVhLTQ4NjMtODQyMi00NzZkNTk3YzAzYWEiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwiaWF0IjoxNzY1MDU5NzA1LCJleHAiOjE3Njc2NTE3MDV9.Wdynr2U31dy-yajfol1oRFeSjDtrC0KWyuLm-QBcfMA';

// 1. Get pipelines
const getPipelines = () => {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 3000,
      path: '/api/pipelines',
      headers: { 'Cookie': `auth_token=${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
};

// 2. Get deals for pipeline
const getDeals = (pipelineId) => {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 3000,
      path: `/api/pipelines/${pipelineId}/deals`,
      headers: { 'Cookie': `auth_token=${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
};

async function test() {
  try {
    console.log('1. Getting pipelines...');
    const pipelines = await getPipelines();
    console.log('Pipelines:', pipelines.length);
    
    if (pipelines.length > 0) {
      const pipelineId = pipelines[0].id;
      console.log('\n2. Getting deals for pipeline:', pipelineId.substring(0, 8) + '...');
      
      const data = await getDeals(pipelineId);
      console.log('\nStages:', data.stages?.length || 0);
      
      if (data.stages) {
        data.stages.forEach((stage, i) => {
          console.log(`\n${i + 1}. ${stage.name} (${stage.deals?.length || 0} deals)`);
          if (stage.deals && stage.deals.length > 0) {
            stage.deals.forEach(deal => {
              console.log(`   - ${deal.title || 'NO TITLE'} (ID: ${deal.id?.substring(0, 8)}...)`);
              console.log(`     Budget: ${deal.budget || deal.value || 0}`);
              console.log(`     Company: ${deal.company_name || 'None'}`);
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
