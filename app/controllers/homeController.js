'use strict';

app.controller('homeController', function ($scope, $http, timetabler, utsYqlService) {
  var TimetableList = timetabler.TimetableList,
      FilterInfo    = timetabler.FilterInfo;
  
  $scope.selectedSubject  = undefined;
  $scope.selectedSubjects = [];
  $scope.semester = 'AUT';
  $scope.filters = {
    numberOfDays: {
      count: 2,
      exact: false,
      options: [1, 2, 3, 4, 5]
    },
    times: {
      start:  '09:00',
      finish: '18:00'
    },
    days: {
      available: [true, true, true, true, true, false, false],
      options: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    }
  };
  
  // Download the subject list.
  $http.get('subjects.json')
    .then(function (res) {
      $scope.subjects = res.data;
    }, function (err) {
      $scope.subjects = [];
      console.log(err);
    }
  );
  
  /**
   * Filters the subject array to only subjects that
   * match ALL of the following criteria:
   * - Name contains the input string
   * - Value contains the selected semester
   * - Value is a standard (S) subject
   */
  $scope.subjectFilter = function (input) {
    return function (subject) {
      return subject.name.indexOf(input) !== -1 && 
             subject.value.indexOf($scope.semester) !== -1 &&
             subject.value.indexOf('_S') !== -1;
    };
  };
  
  /**
   * Adds the selected subject to the list.
   */
  $scope.addSubject = function () {
    var subList = $scope.selectedSubjects,
        subNew  = $scope.selectedSubject;
    
    if (typeof subNew === 'undefined') {
      console.log('No subject selected');
    } else if (subList.indexOf(subNew) !== -1) {
      console.log('Duplicate subject');
    } else if (isSubject(subNew)) {
      $scope.selectedSubjects.push($scope.selectedSubject);
      console.log('Subjects: ' + $scope.selectedSubjects.length);
    }
    
    $scope.selectedSubject = undefined;
    
    /**
     * Determines if an object qualifies as
     * a subject.
     */
    function isSubject(subject) {
      var requiredKeys = ['name', 'value'],
          actualKeys   = Object.keys(subject);

      return requiredKeys.every(function (key) {
        return actualKeys.indexOf(key) !== -1;
      });
    }
  };
  
  /**
   * Removes a subject from the list.
   */
  $scope.removeSubject = function (listItem) {
    var index = $scope.selectedSubjects.indexOf(listItem);
    if (index !== -1) {
      $scope.selectedSubjects.splice(index, 1);
    }
  };
  
  /**
   * Downloads a list of timetables for the
   * selected subjects.
   */
  $scope.loadTimetables = function ($event) {
    var subjects = $scope.selectedSubjects;
    utsYqlService.getTimetableList(subjects, onTimetablesLoaded);
  };
  
  /**
   * Manipulates the timetable list after downloading.
   */
  function onTimetablesLoaded(timetableList) {
    timetableList.sort(TimetableList.SortBy.HoursOnCampus);
    
    var filters = getPreferenceFilters();
    
    var filteredByDays = timetableList.filterMany(filters);
    
    var days = $scope.filters.days;
    var daysString = 'only on ' + JSON.stringify(days.available);
    
    var numberOfDays = $scope.filters.numberOfDays;
    var numberOfDaysString = 'span ' + numberOfDays.count + ' days' +
        ($scope.filters.numberOfDays.exact ? ' exactly: ' : ' or less');
    
    var output = 'Timetables ' + daysString + ' that ' + numberOfDaysString;
    
    console.log(output + ': ' + filteredByDays.length);
  }
  
  /**
   * Sets up filters based on the user's 
   * selection.
   */
  function getPreferenceFilters() {
    return [getDays(), getNumberOfDays()];
    
    function getDays() {
      var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      var filterInfo = days.filter(function (day, i) {
        return $scope.filters.days.available[i];
      });
      return new FilterInfo(TimetableList.FilterBy.Days, {days: filterInfo});
    }
    
    function getNumberOfDays() {
      var filterInfo = $scope.filters.numberOfDays;
      return new FilterInfo(TimetableList.FilterBy.NumberOfDays, filterInfo);
    }
  }
});